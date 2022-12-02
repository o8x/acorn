package model

func GetTheme() string {
	if theme, _ := db.GetTheme(ctx); theme == "gray" {
		return "Gray"
	} else if theme == "dark" {
		return "Dark"
	}
	return "Light"
}
