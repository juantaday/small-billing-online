# Sri Sandbox

Herramienta local para validar XSD y firmar XML de prueba.

## Uso

```
node dist/main.js --xml ./fixtures/factura-sample.xml
```

Con firma:

```
node dist/main.js --xml ./fixtures/factura-sample.xml --cert /ruta/cert.p12 --password CLAVE --out ./signed.xml
```
