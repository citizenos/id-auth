# ID-Auth

Service for authenticating with Estonian ID-card (https://www.id.ee/index.php?id=30470)

API contains only 2 endpoints:

* `GET|POST /authorize` - called with client certificate in HTTP `x-ssl-client-cert` request header and get a **token** in return. See "How it works?" for details.
* `GET /info?token=:token` - with **token** and `x-api-key` for authentication to get certificate info. See "How it works?" for details.

## How it works?

* Application calls `GET /authorize` endpoint via a proxy (Nginx, HAProxy..) that will do the client certificate auth and passes the certificate on to the endpoint in HTTP `x-ssl-client-cert` header. 
* Endpoint calls DigiDocService (DDS) `CheckCertificate` method (http://sk-eid.github.io/dds-documentation/api/api_docs/#checkcertificate), stores the result in memory and returns a **token** for the data.
* Application calls `GET /info` with the issued **token** and `x-api-key` to get the DDS service response.

## Who would need a service like that?

* You have man different applications that need ID-card authentication, this is a single service that can provide it to all of the applications.
* In case you have an application deployed in a cloud where client certificate authentication configuration is impossible (Heroku for example). Deploy this as a separate service to a server where you can set up your own proxy.

## Requirements

* Proxy (Nginx, HAProxy...) that does the client certificate authentication and passes on the certificate in the HTTP `x-ssl-client-cert` request header to the application route.

Example client certificate auth Nginx configuration:

```
server {
    listen 443;
    server_name id.citizenos.com;
    
    access_log /var/log/nginx/id-auth.access.log;
    error_log /var/log/nginx/id-auth.error.log;

    ssl on;
    ssl_certificate /my/server/certificates/server.cert;
    ssl_certificate_key /my/server/certificates/private/server.key;
    ssl_client_certificate /my/server/certificates/esteid.bundle.crt;
    ssl_verify_client on;
    ssl_session_cache off;
    ssl_verify_depth 2;
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
    ssl_ciphers 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-DSS-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-DSS-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA:DHE-RSA-AES256-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA:AES:CAMELLIA:DES-CBC3-SHA:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!aECDH:!EDH-DSS-DES-CBC3-SHA:!EDH-RSA-DES-CBC3-SHA:!KRB5-DES-CBC3-SHA';
    ssl_prefer_server_ciphers on;
    ssl_dhparam /etc/ssl/dhparams.pem;

    location /authorize {
        expires -1;
        
        if ($ssl_client_verify != SUCCESS) { 
            return 403; 
        }
        
        proxy_pass http://localhost:3080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-SSL-CLIENT-VERIFY $ssl_client_verify;
        proxy_set_header X-SSL-CLIENT-CERT $ssl_client_cert;
    }
}

server {
    listen 8443;
    server_name id.citizenos.com;
    
    access_log /var/log/nginx/id-auth.access.log;
    error_log /var/log/nginx/id-auth.error.log;

    ssl on;
    ssl_certificate /my/server/certificates/server.cert;
    ssl_certificate_key /my/server/certificates/private/server.key;
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
    ssl_ciphers 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-DSS-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-DSS-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA:DHE-RSA-AES256-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA:AES:CAMELLIA:DES-CBC3-SHA:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!aECDH:!EDH-DSS-DES-CBC3-SHA:!EDH-RSA-DES-CBC3-SHA:!KRB5-DES-CBC3-SHA';
    ssl_prefer_server_ciphers on;
    ssl_dhparam /etc/ssl/dhparams.pem;

    location /info {
        expires -1;
        proxy_pass http://localhost:3080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```



## Contributing

### Pull requests

* All pull requests to `master` branch

### Running locally

* Clone this repo
* `npm install`
* `npm start`


## Credits

* [CitizenOS](https://citizenos.com) for funding the development 
