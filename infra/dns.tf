data "azurerm_dns_zone" "main" {
  name                = var.dns_zone_name
  resource_group_name = var.dns_zone_resource_group
}

resource "azurerm_dns_a_record" "api" {
  name                = var.api_subdomain
  zone_name           = data.azurerm_dns_zone.main.name
  resource_group_name = data.azurerm_dns_zone.main.resource_group_name
  ttl                 = 300
  records             = [azurerm_public_ip.main.ip_address]
}


# CNAME for scraperagent.victorz.cloud → cname.vercel-dns.com
# Managed directly in Azure DNS (already exists outside Terraform state)
