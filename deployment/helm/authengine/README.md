# authengine Helm chart

K3s/Rancher stack: API, dashboard, Postgres, MongoDB, Redis, Ingress, migrate + seed Jobs.

## Production

| | Command |
|---|---------|
| **Local VM + Cloudflare** | `../../scripts/deploy-local-vm.sh helm` |
| **AWS / any cloud VM** | `../../scripts/deploy-aws.sh helm` |

```bash
cp values.yaml prod-values.yaml   # set secrets.* and seed.*
helm upgrade --install authengine . -n authengine -f prod-values.yaml
```

Guide: [docs.authengine.org/deployment](https://docs.authengine.org/deployment/)
