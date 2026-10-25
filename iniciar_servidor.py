#!/usr/bin/env python3
"""Servidor local del prototipo FCM: prueba puertos y solo abre navegador tras bind exitoso."""
from __future__ import annotations
import argparse
import json
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import socket
import sys
import webbrowser

BASE = Path(__file__).resolve().parent / "autonomo"
VERSION = json.loads((Path(__file__).resolve().parent / "package.json").read_text(encoding="utf-8"))["version"]
PORTS = (5173, 8000, 8080, 8765, 0)


def launch(host: str = "127.0.0.1", open_browser: bool = True):
    if not BASE.is_dir() or not (BASE / "index.html").is_file():
        raise RuntimeError("No se encontro la carpeta autonomo. Extrae el ZIP completo.")
    handler = partial(SimpleHTTPRequestHandler, directory=str(BASE))
    # 127.0.0.1 evita problemas de resolucion IPv4/IPv6 de 'localhost'.
    problems = []
    server = None
    for port in PORTS:
        try:
            server = ThreadingHTTPServer((host, port), handler)
            break
        except OSError as exc:
            problems.append(f"{port or 'automatico'}: {exc}")
            print(f"Puerto {port or 'automatico'} no disponible ({exc}). Probando el siguiente...", flush=True)
    if server is None:
        raise RuntimeError("Windows no permitio abrir ningun puerto.\n" + "\n".join(problems))
    server.daemon_threads = True
    port = server.server_address[1]
    url = f"http://127.0.0.1:{port}/?version={VERSION}"
    print("\n============================================", flush=True)
    print(f"  NAVEGADOR FCM - prototipo v{VERSION}", flush=True)
    print("  Servidor iniciado correctamente", flush=True)
    print(f"  Abrir: {url}", flush=True)
    print("  Para detener: Ctrl+C", flush=True)
    print("============================================\n", flush=True)
    if open_browser:
        try:
            webbrowser.open(url)
        except Exception as exc:
            print(f"No se pudo abrir el navegador automaticamente: {exc}")
    try:
        server.serve_forever(poll_interval=0.25)
    except KeyboardInterrupt:
        print("\nServidor detenido.")
    finally:
        server.server_close()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Iniciar Navegador FCM autonomo")
    parser.add_argument('--no-browser', action='store_true', help='No abrir navegador automaticamente')
    args=parser.parse_args()
    try:
        launch(open_browser=not args.no_browser)
    except (RuntimeError, OSError) as exc:
        print(f"\nERROR: {exc}",file=sys.stderr)
        print("Verifica permisos de Windows, antivirus y reglas de firewall.",file=sys.stderr)
        sys.exit(1)
