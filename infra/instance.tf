resource "scaleway_iam_ssh_key" "main" {
  name       = "scraperagent-deploy"
  public_key = var.ssh_public_key
}

resource "scaleway_instance_server" "main" {
  name              = "srv-scraperagent"
  type              = var.instance_type
  image             = "ubuntu_jammy"
  ip_id             = scaleway_instance_ip.main.id
  security_group_id = scaleway_instance_security_group.main.id

  user_data = {
    cloud-init = file("${path.module}/cloud-init.yml")
  }

  private_network {
    pn_id = scaleway_vpc_private_network.main.id
  }

  tags = ["scraperagent", "terraform"]
}
