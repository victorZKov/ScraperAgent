# Domain scraperagent.eu is managed on Scaleway DNS
# CNAME: scraperagent.eu → cname.vercel-dns.com (configured in Scaleway console)

resource "scaleway_domain_record" "api" {
  dns_zone = var.dns_zone
  name     = "api"
  type     = "A"
  data     = scaleway_instance_ip.main.address
  ttl      = 300
}
