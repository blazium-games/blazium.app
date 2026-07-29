package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/gorilla/mux"
)

type FileDetails struct {
	Base FileInfo `json:"base"`
	Mono FileInfo `json:"mono"`
}

type MirrorListResponse struct {
	Version   string        `json:"version"`
	Timestamp string        `json:"timestamp"`
	Mirrors   []MirrorEntry `json:"mirrors"`
}

type MirrorEntry struct {
	Name     string   `json:"name"`
	Url      string   `json:"url"`
	Checksum Checksum `json:"checksum"`
	Filesize string   `json:"filesize"`
}

type Release struct {
	Name         string `json:"name"`
	ReleaseDate  string `json:"release_date"`
	ReleaseNotes string `json:"release_notes"`
}

type FileInfo struct {
	Name      string     `json:"name"`
	Filename  string     `json:"filename"`
	Filesize  string     `json:"filesize"`
	Checksum  Checksum   `json:"checksum"`
	URL       string     `json:"url"`
	Timestamp string     `json:"timestamp"`
	Mirrors   []FileInfo `json:"mirrors"`
}

type Checksum struct {
	SHA512 string `json:"512"`
	SHA256 string `json:"256"`
}

// MirrorListHandler serves Godot/Blazium Export Template Manager mirror metadata.
// Prefer CDN details.json (bundle schema). Fall back to legacy templates.json when it
// is still the {base,mono} bundle format (not the per-file Cerebro array).
func MirrorListHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	version := vars["version"]

	versionParts := strings.Split(version, ".")
	if len(versionParts) < 4 {
		http.Error(w, "Invalid version format", http.StatusBadRequest)
		return
	}

	baseVersion := strings.Join(versionParts[0:3], ".")
	versionType := versionParts[3]

	details, found, err := fetchBundleDetails(versionType, baseVersion)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if !found {
		emptyResponse := MirrorListResponse{
			Version: version,
			Mirrors: []MirrorEntry{},
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(emptyResponse)
		return
	}

	var fileInfo FileInfo
	if len(versionParts) > 4 && versionParts[4] == "mono" {
		fileInfo = details.Mono
	} else {
		fileInfo = details.Base
	}

	mirrorList := MirrorListResponse{
		Version:   version,
		Timestamp: fileInfo.Timestamp,
		Mirrors:   make([]MirrorEntry, 0, 1+len(fileInfo.Mirrors)),
	}

	if fileInfo.Name != "" || fileInfo.URL != "" {
		mirrorList.Mirrors = append(mirrorList.Mirrors, MirrorEntry{
			Name:     fileInfo.Name,
			Url:      fileInfo.URL,
			Checksum: fileInfo.Checksum,
			Filesize: fileInfo.Filesize,
		})
	}

	for _, mirror := range fileInfo.Mirrors {
		if mirror.URL == "" {
			continue
		}
		mirrorList.Mirrors = append(mirrorList.Mirrors, MirrorEntry{
			Name:     mirror.Name,
			Url:      mirror.URL,
			Checksum: mirror.Checksum,
			Filesize: mirror.Filesize,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(mirrorList)
}

func fetchBundleDetails(versionType, baseVersion string) (FileDetails, bool, error) {
	base := cdnPublicBase()
	candidates := []string{
		fmt.Sprintf("%s/%s/%s/details.json", base, versionType, baseVersion),
		fmt.Sprintf("%s/%s/%s/templates.json", base, versionType, baseVersion),
	}
	for _, url := range candidates {
		details, found, err := tryFetchBundleDetails(url)
		if err != nil {
			return FileDetails{}, false, err
		}
		if found {
			return details, true, nil
		}
	}
	return FileDetails{}, false, nil
}

func tryFetchBundleDetails(url string) (FileDetails, bool, error) {
	resp, err := http.Get(url)
	if err != nil {
		return FileDetails{}, false, fmt.Errorf("failed to fetch %s: %w", url, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return FileDetails{}, false, nil
	}
	if resp.StatusCode != http.StatusOK {
		return FileDetails{}, false, fmt.Errorf("failed to fetch %s: status %d", url, resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return FileDetails{}, false, fmt.Errorf("failed to read %s: %w", url, err)
	}

	trimmed := strings.TrimSpace(string(body))
	if trimmed == "" || strings.HasPrefix(trimmed, "[") {
		// Missing or per-file Cerebro array — not the Godot bundle schema.
		return FileDetails{}, false, nil
	}

	var details FileDetails
	if err := json.Unmarshal(body, &details); err != nil {
		return FileDetails{}, false, nil
	}
	if details.Base.URL == "" && details.Base.Filename == "" &&
		details.Mono.URL == "" && details.Mono.Filename == "" {
		return FileDetails{}, false, nil
	}
	return details, true, nil
}
