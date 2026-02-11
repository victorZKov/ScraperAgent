output "kubeconfig" {
  value       = scaleway_k8s_cluster.main.kubeconfig[0].config_file
  description = "Kubeconfig for kubectl access"
  sensitive   = true
}

output "cluster_id" {
  value       = scaleway_k8s_cluster.main.id
  description = "Kapsule cluster ID"
}

output "cluster_url" {
  value       = scaleway_k8s_cluster.main.apiserver_url
  description = "Kubernetes API server URL"
}
