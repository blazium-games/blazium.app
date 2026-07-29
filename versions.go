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
	"sort"
	"strconv"
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
	CDNBase  string              `json:"cdn_base"`
}

type ToolsDownloadOptions struct {
	Versions map[string][]string                       `json:"versions"`
	Names    map[string]string                         `json:"names"`
	Os       []string                                  `json:"os"`
	CDNBase  string                                    `json:"cdn_base"`
	Files    map[string]map[string]map[string]string   `json:"files"` // tool -> os -> version -> download_url
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

func versionListCount(versions map[string][]string) int {
	n := 0
	for _, list := range versions {
		n += len(list)
	}
	return n
}

// updateCache reads the options the JSON file
// and adds the available versions.
func updateCache() {
	cacheMutex.Lock()
	defer cacheMutex.Unlock()

	cdnBase := cdnPublicBase()

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

	editorVersions, err := getEditorVersions()
	if err != nil {
		log.Printf("Error fetching editor versions: %v", err)
		editorVersions = nil
	}
	if versionListCount(editorVersions) == 0 &&
		editorDownloadOptionsCache != nil &&
		versionListCount(editorDownloadOptionsCache.Versions) > 0 {
		log.Printf("warning: editor catalog empty; keeping previous version list")
		editorVersions = editorDownloadOptionsCache.Versions
	}
	if editorVersions == nil {
		editorVersions = map[string][]string{}
	}
	editorDownloadOptionsCache = &EditorDownloadOptions{
		Versions: editorVersions,
		Options:  fileEditorOptions.Options,
		Commands: fileEditorOptions.Commands,
		CDNBase:  cdnBase,
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

	toolVersions, toolFiles, err := getToolsCatalog(tools)
	if err != nil {
		log.Printf("Error fetching tool versions: %v", err)
		toolVersions = nil
		toolFiles = nil
	}
	if versionListCount(toolVersions) == 0 &&
		toolsDownloadOptionsCache != nil &&
		versionListCount(toolsDownloadOptionsCache.Versions) > 0 {
		log.Printf("warning: tools catalog empty; keeping previous version list")
		toolVersions = toolsDownloadOptionsCache.Versions
		toolFiles = toolsDownloadOptionsCache.Files
	}
	if toolVersions == nil {
		toolVersions = map[string][]string{}
	}
	if toolFiles == nil {
		toolFiles = map[string]map[string]map[string]string{}
	}
	toolsDownloadOptionsCache = &ToolsDownloadOptions{
		Versions: toolVersions,
		Names:    fileToolsOptions.Names,
		Os:       fileToolsOptions.Os,
		CDNBase:  cdnBase,
		Files:    toolFiles,
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

// compareVersionsDesc reports whether a should sort before b (newest first).
func compareVersionsDesc(a, b string) bool {
	ap := strings.Split(a, ".")
	bp := strings.Split(b, ".")
	n := len(ap)
	if len(bp) > n {
		n = len(bp)
	}
	for i := 0; i < n; i++ {
		var ai, bi int
		if i < len(ap) {
			ai, _ = strconv.Atoi(ap[i])
		}
		if i < len(bp) {
			bi, _ = strconv.Atoi(bp[i])
		}
		if ai != bi {
			return ai > bi
		}
	}
	return a > b
}

// getEditorVersions fetches the version data for all build types
// and returns them in more manageable format.
// Missing channels (e.g. pre-release 404) are skipped; they do not wipe other channels.
func getEditorVersions() (map[string][]string, error) {
	versions := make(map[string][]string)
	buildTypes := []string{"nightly", "pre-release", "release"}
	useLocal := len(os.Args) > 1 && os.Args[1] == "--local"

	for _, buildType := range buildTypes {
		var versionsData []VersionPayload
		var err error
		if useLocal {
			versionsData, err = localEditorVersions(buildType)
		} else {
			versionsData, err = fetchCerebroVersionData(buildType)
		}
		if err != nil {
			log.Printf("Error loading editor versions for %s: %v (skipping channel)", buildType, err)
			continue
		}
		list := make([]string, 0, len(versionsData))
		for _, version := range versionsData {
			if version.Version == "" {
				continue
			}
			list = append(list, version.Version)
		}
		if len(list) == 0 {
			continue
		}
		versions[buildType] = list
	}
	return versions, nil
}

// getToolsCatalog loads tool version lists and per-OS download URLs from CDN manifests.
// Missing tool manifests are skipped without clearing other tools.
func getToolsCatalog(tools []string) (map[string][]string, map[string]map[string]map[string]string, error) {
	versions := make(map[string][]string)
	files := make(map[string]map[string]map[string]string)
	useLocal := len(os.Args) > 1 && os.Args[1] == "--local"

	for _, tool := range tools {
		if useLocal {
			versionsData, err := localToolsVersions(tool, "windows")
			if err != nil {
				log.Printf("Error loading tool versions for %s: %v (skipping)", tool, err)
				continue
			}
			seen := map[string]bool{}
			list := make([]string, 0, len(versionsData))
			for _, row := range versionsData {
				if row.Version == "" || seen[row.Version] {
					continue
				}
				seen[row.Version] = true
				list = append(list, row.Version)
				osName := strings.ToLower(row.OS)
				if osName == "" {
					osName = "windows"
				}
				if files[tool] == nil {
					files[tool] = make(map[string]map[string]string)
				}
				if files[tool][osName] == nil {
					files[tool][osName] = make(map[string]string)
				}
				if row.File != "" {
					files[tool][osName][row.Version] = row.File
				}
			}
			sort.Slice(list, func(i, j int) bool { return compareVersionsDesc(list[i], list[j]) })
			if len(list) > 0 {
				versions[tool] = list
			}
			continue
		}

		doc, err := loadToolManifest(tool)
		if err != nil {
			log.Printf("Error loading tool manifest for %s: %v (skipping)", tool, err)
			continue
		}
		list := make([]string, 0, len(doc.Versions))
		for version, entry := range doc.Versions {
			list = append(list, version)
			if files[tool] == nil {
				files[tool] = make(map[string]map[string]string)
			}
			for _, d := range entry.Downloads {
				osName := strings.ToLower(strings.TrimSpace(d.Platform))
				if osName == "" || d.DownloadURL == "" {
					continue
				}
				if files[tool][osName] == nil {
					files[tool][osName] = make(map[string]string)
				}
				files[tool][osName][version] = d.DownloadURL
			}
		}
		sort.Slice(list, func(i, j int) bool { return compareVersionsDesc(list[i], list[j]) })
		if len(list) > 0 {
			versions[tool] = list
		}
	}
	return versions, files, nil
}

// getToolsVersions fetches tool version lists (legacy helper used by tests).
func getToolsVersions(tools []string) (map[string][]string, error) {
	versions, _, err := getToolsCatalog(tools)
	return versions, err
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
