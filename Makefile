.DEFAULT_GOAL := help
PORT ?= 4173

.PHONY: help install build check test verify dev preview codeql clean

help:
	@printf '%s\n' 'make install  Instala las herramientas con el lockfile' 'make dev      Abre el servidor local (PORT=4173)' 'make build    Genera el paquete Apps Script en dist/' 'make check    Comprueba sintaxis, perfiles y manifiesto' 'make test     Compila y ejecuta las pruebas' 'make verify   Ejecuta los checks y las pruebas de CI' 'make preview  Genera output/preview.html sin servidor' 'make codeql   Prepara JavaScript para CodeQL' 'make clean    Elimina únicamente archivos generados'

install:
	npm ci --ignore-scripts

build:
	npm run build

check:
	npm run check

test:
	npm test

verify:
	npm run verify

dev:
	PORT=$(PORT) npm run preview

preview: build
	node scripts/preview.mjs --write-only

codeql: build
	npm run codeql:prepare

clean:
	rm -rf dist output codeql-source codeql-results
