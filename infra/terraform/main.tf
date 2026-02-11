provider "scaleway" {
  zone   = var.zone
  region = var.region
}

# Private network for the Kapsule cluster
resource "scaleway_vpc_private_network" "kapsule" {
  name   = "pn-kapsule"
  region = var.region
  tags   = ["kapsule", "terraform"]
}

# Kapsule cluster (control plane is free)
resource "scaleway_k8s_cluster" "main" {
  name    = "k8s-main"
  version = var.k8s_version
  cni     = "cilium"

  private_network_id          = scaleway_vpc_private_network.kapsule.id
  delete_additional_resources = true

  auto_upgrade {
    enable                        = true
    maintenance_window_start_hour = 3
    maintenance_window_day        = "sunday"
  }

  autoscaler_config {
    disable_scale_down = true
  }

  tags = ["kapsule", "terraform"]
}

# Single-node pool (cost optimized)
resource "scaleway_k8s_pool" "default" {
  cluster_id = scaleway_k8s_cluster.main.id
  name       = "default"
  node_type  = var.node_type
  size       = 1

  min_size    = 1
  max_size    = 1
  autoscaling = false
  autohealing = true

  wait_for_pool_ready = true
}
