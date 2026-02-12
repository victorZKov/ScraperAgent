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

variable "node_type" {
  description = "Kapsule node instance type"
  type        = string
  default     = "DEV1-M"
}

variable "k8s_version" {
  description = "Kubernetes version for Kapsule"
  type        = string
  default     = "1.31"
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

variable "ingress_lb_ip" {
  description = "External IP of the ingress-nginx LoadBalancer"
  type        = string
}
