resource "scaleway_vpc_private_network" "main" {
  name   = "pn-scraperagent"
  region = var.region
  tags   = ["scraperagent", "terraform"]
}

resource "scaleway_instance_security_group" "main" {
  name                    = "sg-scraperagent"
  inbound_default_policy  = "drop"
  outbound_default_policy = "accept"

  inbound_rule {
    action = "accept"
    port   = 22
  }

  inbound_rule {
    action = "accept"
    port   = 80
  }

  inbound_rule {
    action = "accept"
    port   = 443
  }
}

resource "scaleway_instance_ip" "main" {
  type = "routed_ipv4"
}
