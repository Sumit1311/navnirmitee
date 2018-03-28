#!/bin/sh

exec socat STDIO PROXY:10.43.3.110:$1:$2,proxyport=8080
