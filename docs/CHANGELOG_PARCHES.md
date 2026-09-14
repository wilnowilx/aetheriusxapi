# Registro Técnico de Parches y Puentes — Hydra V5 & Sentinel

Este documento registra la topología oficial de puertos, servicios y parches aplicados para eliminar la incertidumbre operativa en las VMs de GCP.

## Topología de Puertos en Bélgica (`sentinel-v4`)
- **Port 80 (`nginx`)**: Proxy inverso HTTP que sirve el Dashboard estático de React y enruta `/api/` y `/ws` al backend, además de `/intel/` al Intelligence Daemon.
- **Port 8001 (`hydra-backend`)**: FastAPI engine con PriceBus v5.1, simulación de paper trading y proxy a daemons.
- **Port 8443 (`hydra-relay`)**: Relay multiexchange WebSocket (Binance, Bybit, OKX) para precio agregado en tiempo real.
- **Port 8600 (`intel-daemon`)**: Daemon standalone de Market Intelligence (Fear & Greed, Ballenas, On-chain).
- **Port 8080 (`sentinel`)**: Guardián de trading y salud del sistema.
- **Port 8085 (`sld-pipeline`)**: Pipeline de extracción y auditoría de proxies / cuentas huérfanas.
- **Port 4222 / 7423 / 7425**: NATS Message Bus y túneles de malla tripartita (Bélgica ↔ Virginia ↔ Singapur).

## Política de Despliegue
- **Prohibido `tar/scp` manuales no versionados.** Todo cambio debe transitar por el script maestro `deploy/deploy.sh`.
- **Source of Truth:** Repositorio Git unificado.
