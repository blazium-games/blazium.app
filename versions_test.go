package main

import "testing"

func TestCompareVersionsDesc(t *testing.T) {
	if !compareVersionsDesc("0.6.748", "0.6.725") {
		t.Fatal("expected 0.6.748 before 0.6.725")
	}
	if compareVersionsDesc("0.6.1", "0.6.10") {
		t.Fatal("expected 0.6.10 before 0.6.1")
	}
}

func TestVersionListCount(t *testing.T) {
	if versionListCount(nil) != 0 {
		t.Fatal("nil should be 0")
	}
	n := versionListCount(map[string][]string{
		"nightly": {"a", "b"},
		"release": {"c"},
	})
	if n != 3 {
		t.Fatalf("got %d want 3", n)
	}
}

func TestGetEditorVersionsSkipsMissingChannel(t *testing.T) {
	// Integration-ish: against live CDN, pre-release may 404 but nightly/release must remain.
	// Skip if offline.
	versions, err := getEditorVersions()
	if err != nil {
		t.Fatalf("getEditorVersions: %v", err)
	}
	if len(versions["nightly"]) == 0 && len(versions["release"]) == 0 {
		t.Fatalf("expected nightly or release versions from CDN, got %#v", versions)
	}
	// Missing pre-release must not wipe other channels (key may be absent or empty).
	if _, wiped := versions[""]; wiped {
		t.Fatal("unexpected empty channel key")
	}
}
