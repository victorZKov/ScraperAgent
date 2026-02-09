resource "scaleway_rdb_instance" "main" {
  name           = "rdb-scraperagent"
  node_type      = var.db_node_type
  engine         = "PostgreSQL-16"
  user_name      = "scraperagent"
  password       = var.postgres_password
  disable_backup = false
  volume_type    = "lssd"

  private_network {
    pn_id       = scaleway_vpc_private_network.main.id
    enable_ipam = true
  }

  tags = ["scraperagent", "terraform"]
}

resource "scaleway_rdb_database" "main" {
  instance_id = scaleway_rdb_instance.main.id
  name        = "scraperagent"
}
