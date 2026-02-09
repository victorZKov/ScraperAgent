variable "location" {
  description = "Azure region"
  type        = string
  default     = "westeurope"
}

variable "resource_group_name" {
  description = "Resource group name"
  type        = string
  default     = "rg-scraperagent"
}

variable "vm_size" {
  description = "VM size"
  type        = string
  default     = "Standard_B1ms"
}

variable "vm_admin_username" {
  description = "VM admin SSH username"
  type        = string
  default     = "azureuser"
}

variable "ssh_public_key" {
  description = "SSH public key for VM access"
  type        = string
}

variable "dns_zone_name" {
  description = "Existing DNS zone name"
  type        = string
  default     = "victorz.cloud"
}

variable "dns_zone_resource_group" {
  description = "Resource group containing the DNS zone"
  type        = string
}

variable "api_subdomain" {
  description = "Subdomain for the API"
  type        = string
  default     = "api.scraperagent"
}
