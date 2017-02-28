# Server Setup

Running `micro-analytics` on a server is a simple two step process:

1. Start and daemonize the app with `pm2`
2. Setup `nginx` as a reverse proxy to make your service publicy accessible

## Prerequisite: A server

If you don't have a server to run this on yet, here is what I do:

I use and like [DigitalOcean](https://m.do.co/c/d371ed7f99af) (referral link) for my servers. A simple, 5$/month droplet will suffice to run this service reliably. (upgrading to more power in case of big traffic is two clicks away too)

Make sure to choose the `NodeJS x.x.x on 16.04` (where `x.x.x` is the highest version number you can find) one-click app when creating the droplet to get the server fully setup with Node and Ubuntu.

## Start and deamonize the app

Install `micro-analytics` on your server by running `npm install -g micro-analytics-cli` in its shell.

We'll use `pm2` to start and deamonize the app. This means that the app isn't bound to the terminal, and we'll also make `pm2` start the app when the server start. (this avoids the service being down in case your server reboots)

First run `npm install -g pm2` to get `pm2`, then run `pm2 start micro-analytics`. This tells `pm2` to run `micro-analytics` in the background.

To make sure our service stays up even if the server reboots we run `pm2 startup ubuntu` (replace `ubuntu` with whatever OS you're using) and `pm2 save`.

## Set up `nginx`

Get `nginx` by running `sudo apt-get install nginx`, then configure it to reroute all incoming requests to the server to `micro-analytics`.

Delete the default site from nginx by running `sudo rm /etc/nginx/sites-enabled/default`, then create a new one by running `sudo touch /etc/nginx/sites-enabled/<yoursite>`. (replace `<yoursite>` with your site name)

We want to reroute all requests for any path that come in to `localhost:3000` (where `micro-analytics` is running), so edit the `/etc/nginx/sites-enabled/<yoursite>` file to look like this:

```nginx
server {
  listen 80;
  server_name yoursite.com;

  location ~^.*$ {
    proxy_set_header X-Real-IP  $remote_addr;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header Host $host;
    proxy_pass http://localhost:3000;
  }

  # This will avoid favicon.ico being counted when you test the service
  # in the browser.
  location = /favicon.ico {
    access_log off;
    log_not_found off;
    return 204;
  }
}
```

(note that I have no idea what I'm doing here, this was copied from [this tutorial](https://www.digitalocean.com/community/tutorials/how-to-configure-nginx-as-a-reverse-proxy-for-apache))


## Deploying on AWS (Linux AMI)
To connect to your ec2 instance run (in gitbash):    
`ssh -i ./path/to/key.pem ec2-user@xx.xx.xx.xx`  
 key.pem is the key generated when you create an instance.  
 xx.xx.xx.xx is the your public ip

Once connnected to ec2 instance install nodejs   
Add nodejs yum repo and build tools    

`sudo yum install -y gcc-c++ make`  
`sudo curl -sL https://rpm.nodesource.com/setup_6.x | sudo -E bash -`    
### Installing nodejs    
`sudo yum install nodejs`   

check version of nodejs and npm    
```
node -v
npm -v
```
#### Installing nginx   
`sudo yum install nginx`       
Now, make the following changes to /etc/nginx/nginx.conf
`sudo vi /etc/nginx/nginx.conf`
```nginx
server {
        listen 80;
        server_name yourPublicDNS.com;

        location ~^.*$ {
                proxy_set_header X-Real-IP  $remote_addr;
                proxy_set_header X-Forwarded-For $remote_addr;
                proxy_set_header Host $host;
                proxy_pass http://localhost:3000;
        }
}
```
#### Start nginx server    
```
sudo service nginx start   
sudo service nginx status
```
#### Installing micro-analytics-cli
```
npm install micro-analytics-cli -g
micro-analytics
```
##### Important: enable port 80 on your ec2 instance

* Go to aws.amazon.com, Select ec2  and go to running instances     
* On left side navigation menu go to Network & Security > Security groups    
* click on the instance for which the port is to be enabled.     
* click on inbound tab and click edit. Now in the pop up Add Rule and select http    
* save    


Now visit the public DNS    
try to visit some url like www.yourDNS.com/something      
If you only specify the public DNS like www.yourDNS.com u will get the message: please include a path to a page
