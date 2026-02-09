terraform {
  backend "azurerm" {
    resource_group_name  = "ne-mgmt-s01"
    storage_account_name = "scraperagenttfstate"
    container_name       = "tfstate"
    key                  = "scraperagent.tfstate"
    use_oidc             = false
  }
}
