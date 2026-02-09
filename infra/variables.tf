variable "zone" {
  description = "Scaleway zone"
  type        = string
  default     = "nl-ams-1"
}

variable "region" {
  description = "Scaleway region"
  type        = string
  default     = "nl-ams"
}

variable "instance_type" {
  description = "Scaleway instance type"
  type        = string
  default     = "DEV1-S"
}

variable "db_node_type" {
  description = "Scaleway managed database node type"
  type        = string
  default     = "DB-DEV-S"
}

variable "ssh_public_key" {
  description = "SSH public key for instance access"
  type        = string
  sensitive   = true
}

variable "api_domain" {
  description = "Domain for the API endpoint"
  type        = string
  default     = "api.scraperagent.eu"
}

variable "dns_zone" {
  description = "DNS zone (managed on Scaleway)"
  type        = string
  default     = "scraperagent.eu"
}

variable "postgres_password" {
  description = "Password for managed PostgreSQL"
  type        = string
  sensitive   = true
}
