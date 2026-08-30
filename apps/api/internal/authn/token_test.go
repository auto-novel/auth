package authn

import "testing"

func TestTokenPolicyForApp(t *testing.T) {
	tests := []struct {
		app     string
		wantErr bool
	}{
		{app: AppAuth},
		{app: AppN},
		{app: AppF},
		{app: AppLegado},
		{app: "", wantErr: true},
		{app: "unknown", wantErr: true},
	}

	for _, tt := range tests {
		t.Run(tt.app, func(t *testing.T) {
			_, err := TokenPolicyForApp(tt.app)
			if (err != nil) != tt.wantErr {
				t.Fatalf("TokenPolicyForApp(%q) error = %v, wantErr %v", tt.app, err, tt.wantErr)
			}
		})
	}
}
