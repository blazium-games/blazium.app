package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"sync"
	"time"
)

type VersionData struct {
	Name     string    `json:"name"`
	Releases []Release `json:"releases"`
}

type VersionResponse struct {
	Data    []VersionData `json:"data"`
	Success bool          `json:"success"`
}

type ResponsePayload struct {
	Success bool             `json:"success"`
	Data    []VersionPayload `json:"data"`
}

type ToolData struct {
	Name    string `json:"name"`
	Type    string `json:"type"`
	Version string `json:"version"`
	OS      string `json:"os"`
	File    string `json:"file"`
	Sig     string `json:"sig"`
}

type VersionPayload struct {
	DeployType   string `json:"deploy_type"`
	Version      string `json:"version"`
	ChangelogURL string `json:"changelog_url"`
	VersionURL   string `json:"version_url"`
}

type EditorDownloadOptions struct {
	Versions map[string][]string `json:"versions"`
	Options  map[string][]string `json:"options"`
	Commands map[string]string   `json:"commands"`
}

type ToolsDownloadOptions struct {
	Versions map[string][]string `json:"versions"`
	Names    map[string]string   `json:"names"`
	Os       []string            `json:"os"`
}

type EditorFilesDownloads map[string]map[string]map[string]int
type EditorFilesAnalytics struct {
	Timestamp            string
	EditorFilesDownloads EditorFilesDownloads
}

var (
	cacheMutex                 sync.RWMutex
	editorDownloadOptionsCache *EditorDownloadOptions
	toolsDownloadOptionsCache  *ToolsDownloadOptions
	editorFilesAnalyticsCache  *EditorFilesAnalytics

	editorFilesDownloads EditorFilesDownloads
)

func cdnPublicBase() string {
	base := strings.TrimSpace(os.Getenv("CDN_PUBLIC_BASE"))
	if base == "" {
		base = "https://cdn.blazium.app"
	}
	return strings.TrimRight(base, "/")
}

func fetchCDNJSON(url string) ([]byte, error) {
	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("non-200 response: %d", resp.StatusCode)
	}
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}
	return body, nil
}

type cdnToolDownload struct {
	Platform    string `json:"platform"`
	Arch        string `json:"arch"`
	Filename    string `json:"filename"`
	DownloadURL string `json:"download_url"`
	SigURL      string `json:"sig_url"`
	Sha256      string `json:"sha256"`
	Size        int64  `json:"size"`
	Signing     string `json:"signing"`
}

type cdnToolVersion struct {
	ReleasedOn string            `json:"released_on"`
	Downloads  []cdnToolDownload `json:"downloads"`
}

type cdnToolManifest struct {
	Latest     string                    `json:"latest"`
	ReleasedOn string                    `json:"released_on"`
	Versions   map[string]cdnToolVersion `json:"versions"`
}

func loadToolManifest(toolType string) (*cdnToolManifest, error) {
	url := fmt.Sprintf("%s/catalog/tools/%s/manifest.json", cdnPublicBase(), toolType)
	body, err := fetchCDNJSON(url)
	if err != nil {
		return nil, err
	}
	var doc cdnToolManifest
	if err := json.Unmarshal(body, &doc); err != nil {
		return nil, fmt.Errorf("failed to unmarshal JSON: %w", err)
	}
	if doc.Versions == nil {
		doc.Versions = map[string]cdnToolVersion{}
	}
	return &doc, nil
}

func toolDataFromDownload(toolType, version string, d cdnToolDownload) ToolData {
	name := "Blazium Tool"
	if strings.EqualFold(toolType, "cli") {
		name = "Blazium CLI"
	}
	return ToolData{
		Name:    name,
		Type:    toolType,
		Version: version,
		OS:      d.Platform,
		File:    d.DownloadURL,
		Sig:     d.SigURL,
	}
}

// fetchCerebroTools loads tool rows for an OS from the CDN tool manifest.
func fetchCerebroTools(toolType string, osType string) ([]ToolData, error) {
	doc, err := loadToolManifest(toolType)
	if err != nil {
		return nil, err
	}
	wantOS := strings.ToLower(strings.TrimSpace(osType))
	var out []ToolData
	for version, entry := range doc.Versions {
		for _, d := range entry.Downloads {
			if wantOS != "" && strings.ToLower(d.Platform) != wantOS {
				continue
			}
			out = append(out, toolDataFromDownload(toolType, version, d))
		}
	}
	return out, nil
}

// fetchCerebroVersions loads grouped version history from CDN.
func fetchCerebroVersions(buildType string) ([]VersionData, error) {
	url := fmt.Sprintf("%s/catalog/versions/%s/grouped.json", cdnPublicBase(), buildType)
	body, err := fetchCDNJSON(url)
	if err != nil {
		return nil, err
	}
	var apiResponse VersionResponse
	if err := json.Unmarshal(body, &apiResponse); err != nil {
		return nil, fmt.Errorf("failed to unmarshal JSON: %w", err)
	}
	if !apiResponse.Success || apiResponse.Data == nil {
		// Also accept a bare array of VersionData.
		var bare []VersionData
		if err := json.Unmarshal(body, &bare); err == nil {
			return bare, nil
		}
		return []VersionData{}, nil
	}
	return apiResponse.Data, nil
}

// fetchCerebroToolData resolves one tool version/OS from the CDN manifest.
func fetchCerebroToolData(toolType string, osType string, toolVersion string) (*ToolData, error) {
	doc, err := loadToolManifest(toolType)
	if err != nil {
		return nil, err
	}
	entry, ok := doc.Versions[toolVersion]
	if !ok {
		return nil, errors.New("tool version not found")
	}
	wantOS := strings.ToLower(strings.TrimSpace(osType))
	for _, d := range entry.Downloads {
		if wantOS != "" && strings.ToLower(d.Platform) != wantOS {
			continue
		}
		td := toolDataFromDownload(toolType, toolVersion, d)
		return &td, nil
	}
	return nil, errors.New("tool not found for OS")
}

// fetchCerebroVersionData loads the flat version catalog from CDN.
func fetchCerebroVersionData(buildType string) ([]VersionPayload, error) {
	url := fmt.Sprintf("%s/catalog/versions/%s.json", cdnPublicBase(), buildType)
	body, err := fetchCDNJSON(url)
	if err != nil {
		return nil, err
	}
	var versionsData []VersionPayload
	if err := json.Unmarshal(body, &versionsData); err != nil {
		// Compat: wrapped {success,data} shape.
		var apiResponse ResponsePayload
		if err2 := json.Unmarshal(body, &apiResponse); err2 != nil {
			return nil, fmt.Errorf("failed to unmarshal JSON: %w", err)
		}
		if !apiResponse.Success || apiResponse.Data == nil {
			return []VersionPayload{}, nil
		}
		return apiResponse.Data, nil
	}
	return versionsData, nil
}

// updateCache reads the options the JSON file
// and adds the available versions.
func updateCache() {
	cacheMutex.Lock()
	defer cacheMutex.Unlock()

	// Update editor download options cache
	var fileEditorOptions struct {
		Options  map[string][]string `json:"options"`
		Commands map[string]string   `json:"commands"`
	}

	filePath := filepath.Join("data", "editor_download_options.json")

	if err := readJSONFile(filePath, &fileEditorOptions); err != nil {
		log.Printf("Error reading %s: %v", filePath, err)
		return
	}

	versionsJson, err := getEditorVersions()
	if err != nil {
		log.Printf("Error fetching versions: %v", err)
		return
	}

	editorDownloadOptionsCache = &EditorDownloadOptions{
		Versions: versionsJson,
		Options:  fileEditorOptions.Options,
		Commands: fileEditorOptions.Commands,
	}

	// Update tools download options cache
	var fileToolsOptions struct {
		Names map[string]string `json:"names"`
		Os    []string          `json:"os"`
	}

	filePath = filepath.Join("data", "tools_download_options.json")

	if err := readJSONFile(filePath, &fileToolsOptions); err != nil {
		log.Printf("Error reading %s: %v", filePath, err)
		return
	}

	tools := make([]string, 0, len(fileToolsOptions.Names))
	for _, value := range fileToolsOptions.Names {
		tools = append(tools, value)
	}

	versionsJson, err = getToolsVersions(tools)
	if err != nil {
		log.Printf("Error fetching versions: %v", err)
		return
	}

	toolsDownloadOptionsCache = &ToolsDownloadOptions{
		Versions: versionsJson,
		Names:    fileToolsOptions.Names,
		Os:       fileToolsOptions.Os,
	}

	// Update editor file analytics
	editorFilesAnalyticsCache = &EditorFilesAnalytics{
		Timestamp:            time.Now().UTC().Format(time.DateTime),
		EditorFilesDownloads: editorFilesDownloads,
	}
	// Clean the memory then allocate
	editorFilesDownloads = nil
	editorFilesDownloads = make(EditorFilesDownloads)
}

// startCacheUpdater starts a ticker to update the cache every 30 minutes
func startCacheUpdater() {
	ticker := time.NewTicker(30 * time.Minute)
	defer ticker.Stop()

	// Update the cache initially
	updateCache()

	for range ticker.C {
		updateCache()
	}
}

// getEditorVersions fetches the version data for all build types
// and returns them in more manageable format.
func getEditorVersions() (map[string][]string, error) {
	versions := make(map[string][]string)
	buildTypes := []string{"nightly", "pre-release", "release"}

	var versionsData []VersionPayload
	var err error
	for _, buildType := range buildTypes {
		if len(os.Args) > 1 {
			if os.Args[1] == "--local" {
				versionsData, err = localEditorVersions(buildType)
			}
		} else {
			versionsData, err = fetchCerebroVersionData(buildType)
		}
		if err != nil {
			log.Printf("Error loading editor versions: %v", err)
			return map[string][]string{}, nil
		}
		for _, version := range versionsData {
			versions[buildType] = append(versions[buildType], version.Version)
		}
	}
	return versions, nil
}

// getToolsVersions fetches the version data for all build types
// and returns them in more manageable format.
func getToolsVersions(tools []string) (map[string][]string, error) {
	versions := make(map[string][]string)

	var versionsData []ToolData
	var err error
	for _, tool := range tools {
		if len(os.Args) > 1 {
			if os.Args[1] == "--local" {
				versionsData, err = localToolsVersions(tool, "windows")
			}
		} else {
			versionsData, err = fetchCerebroTools(tool, "windows")
		}
		if err != nil {
			log.Printf("Error loading tool versions: %v", err)
			return map[string][]string{}, nil
		}
		for _, version := range versionsData {
			versions[tool] = append(versions[tool], version.Version)
		}
	}
	for i, versionList := range versions {
		slices.Reverse(versionList)
		versions[i] = versionList
	}
	return versions, nil
}

// Used for local editor versions fetch
func localEditorVersions(buildType string) ([]VersionPayload, error) {
	url := fmt.Sprintf("https://blazium.app/api/versions/data/%s", buildType)
	resp, err := http.Get(url)
	if err != nil {
		return []VersionPayload{}, fmt.Errorf("failed to fetch versions for %s: %w", buildType, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return []VersionPayload{}, fmt.Errorf("received non-OK HTTP status for %s: %d", buildType, resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return []VersionPayload{}, fmt.Errorf("failed to read response body for %s: %w", buildType, err)
	}

	var versionsData []VersionPayload
	if err := json.Unmarshal(body, &versionsData); err != nil {
		return []VersionPayload{}, fmt.Errorf("failed to parse versions JSON for %s: %w", buildType, err)
	}
	return versionsData, nil
}

// Used for local tools versions fetch
func localToolsVersions(tool string, os string) ([]ToolData, error) {
	url := fmt.Sprintf("https://blazium.app/api/tools/%s/%s", tool, os)
	resp, err := http.Get(url)
	if err != nil {
		return []ToolData{}, fmt.Errorf("failed to fetch versions for %s: %w", tool, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return []ToolData{}, fmt.Errorf("received non-OK HTTP status for %s: %d", tool, resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return []ToolData{}, fmt.Errorf("failed to read response body for %s: %w", tool, err)
	}

	var versionsData []ToolData
	if err := json.Unmarshal(body, &versionsData); err != nil {
		return []ToolData{}, fmt.Errorf("failed to parse versions JSON for %s: %w", tool, err)
	}
	return versionsData, nil
}
