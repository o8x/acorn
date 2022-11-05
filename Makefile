all:
	@go run -v github.com/kyleconroy/sqlc/cmd/sqlc@latest generate -f backend/sqlc.yaml
	@wails build -u -platform darwin/arm64
