package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gorilla/mux"
)

func TestTryFetchBundleDetails_BundleJSON(t *testing.T) {
	bundle := `{
		"base": {
			"name": "Official",
			"filename": "export_templates.tpz",
			"filesize": "10",
			"checksum": {"512": "a", "256": "b"},
			"url": "https://cdn.example/export_templates.tpz",
			"timestamp": "1 January 2026",
			"mirrors": [{
				"name": "Github",
				"filename": "export_templates.tpz",
				"filesize": "10",
				"checksum": {"512": "a", "256": "b"},
				"url": "https://github.example/export_templates.tpz",
				"timestamp": "1 January 2026"
			}]
		},
		"mono": {
			"name": "Official Mono",
			"filename": "mono_export_templates.tpz",
			"filesize": "11",
			"checksum": {"512": "c", "256": "d"},
			"url": "https://cdn.example/mono_export_templates.tpz",
			"timestamp": "1 January 2026",
			"mirrors": []
		}
	}`
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(bundle))
	}))
	defer server.Close()

	details, found, err := tryFetchBundleDetails(server.URL)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !found {
		t.Fatal("expected bundle details to be found")
	}
	if details.Base.URL != "https://cdn.example/export_templates.tpz" {
		t.Fatalf("unexpected base url: %s", details.Base.URL)
	}
}

func TestTryFetchBundleDetails_RejectsArrayManifest(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`[{"filename":"linux_release.x86_64.zip"}]`))
	}))
	defer server.Close()

	_, found, err := tryFetchBundleDetails(server.URL)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if found {
		t.Fatal("array-format templates.json must not be treated as bundle details")
	}
}

func TestTryFetchBundleDetails_NotFound(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.NotFound(w, r)
	}))
	defer server.Close()

	_, found, err := tryFetchBundleDetails(server.URL)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if found {
		t.Fatal("404 should not be found")
	}
}

func TestMirrorListHandler_EmptyMirrorsArray(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/mirrorlist/0.0.0.dev.json", nil)
	rr := httptest.NewRecorder()

	r := muxRouterForMirrorlist()
	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", rr.Code, rr.Body.String())
	}

	var response MirrorListResponse
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Fatalf("invalid json: %v", err)
	}
	if response.Mirrors == nil {
		t.Fatal("mirrors must be [] not null")
	}
	if len(response.Mirrors) != 0 {
		t.Fatalf("expected empty mirrors, got %d", len(response.Mirrors))
	}
	if strings.Contains(rr.Body.String(), `"mirrors":null`) {
		t.Fatal("response encoded mirrors as null")
	}
}

func TestMirrorListHandler_PrefersDetailsForBrokenTemplatesJSON(t *testing.T) {
	// 0.6.744 has array-format templates.json (breaks old handler) but valid details.json.
	req := httptest.NewRequest(http.MethodGet, "/api/mirrorlist/0.6.744.nightly.json", nil)
	rr := httptest.NewRecorder()
	muxRouterForMirrorlist().ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", rr.Code, rr.Body.String())
	}
	var response MirrorListResponse
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Fatalf("invalid json: %v", err)
	}
	if len(response.Mirrors) < 1 {
		t.Fatalf("expected at least one mirror from details.json, got %#v", response)
	}
	if !strings.Contains(response.Mirrors[0].Url, "export_templates.tpz") {
		t.Fatalf("unexpected first mirror url: %s", response.Mirrors[0].Url)
	}
}

func TestMirrorListHandler_LegacyBundleTemplatesJSON(t *testing.T) {
	// 0.6.681 has legacy bundle templates.json and no details.json.
	req := httptest.NewRequest(http.MethodGet, "/api/mirrorlist/0.6.681.nightly.json", nil)
	rr := httptest.NewRecorder()
	muxRouterForMirrorlist().ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", rr.Code, rr.Body.String())
	}
	var response MirrorListResponse
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Fatalf("invalid json: %v", err)
	}
	if len(response.Mirrors) < 1 {
		t.Fatalf("expected legacy templates.json mirrors, got %#v", response)
	}
}

func muxRouterForMirrorlist() http.Handler {
	r := mux.NewRouter()
	r.HandleFunc("/api/mirrorlist/{version}.json", MirrorListHandler).Methods("GET")
	return r
}
