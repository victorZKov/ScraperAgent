output "vm_public_ip" {
  value       = azurerm_public_ip.main.ip_address
  description = "Public IP of the VM"
}

output "api_fqdn" {
  value       = "${var.api_subdomain}.${var.dns_zone_name}"
  description = "FQDN for the API"
}

output "vm_admin_username" {
  value       = var.vm_admin_username
  description = "SSH username for VM"
}
