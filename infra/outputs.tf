output "instance_public_ip" {
  value       = scaleway_instance_ip.main.address
  description = "Public IP of the instance"
}

output "api_fqdn" {
  value       = var.api_domain
  description = "FQDN for the API"
}

output "db_host" {
  value       = scaleway_rdb_instance.main.private_network[0].ip
  description = "Private network IP of the managed database"
  sensitive   = true
}

output "db_port" {
  value       = scaleway_rdb_instance.main.private_network[0].port
  description = "Port of the managed database"
}
