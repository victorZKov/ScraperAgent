terraform {
  backend "azurerm" {
    storage_account_name = "kodepstr"
    container_name       = "tfstate"
    key                  = "scraperagent.tfstate"
  }
}
