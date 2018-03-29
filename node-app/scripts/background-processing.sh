#!/bin/bash

EXECUTABLE='node'
DEBUG='debug'
SCRIPT='background.js'
USER=`whoami`
if [ $APP_DIR ]; then
    echo "Using app root $APP_DIR"
else
    APP_DIR='/home/geek/workspace/kids-library/node-app'
fi

PIDFILE=$APP_DIR/ajab-gajab-background.pid
LOGFILE=$APP_DIR/ajab-gajab-background.log
DEBUG=0

start() {
    echo $(cat "$PIDFILE");
    if [ -f "$PIDFILE" ] && kill -0 $(cat "$PIDFILE"); then
        echo 'Service already running' >&2
        return 1
    fi
    if [ $DEBUG -eq 1 ]; then 
        local CMD="$EXECUTABLE --debug-brk=5859 $SCRIPT > \"$LOGFILE\" 2>&1";
        $CMD 
        echo $! > "$PIDFILE"
    else
        local CMD="$EXECUTABLE $SCRIPT > \"$LOGFILE\" 2>&1"
        echo $CMD
        #su -c "$CMD" $USER > "$PIDFILE"
        $CMD &
        echo $! > "$PIDFILE"
        echo "disown"
        disown
        echo 'Service started' >&2
    fi
}

stop() {
    if [ ! -f "$PIDFILE" ] || ! kill -0 $(cat "$PIDFILE"); then
        echo 'Service not running' >&2
        return 1
    fi
    echo 'Stopping service…' >&2
    kill -15 $(cat "$PIDFILE") && rm -f "$PIDFILE"
    echo 'Service stopped' >&2
}
if [ "$1" = "--debug" ]; then 
    DEBUG=1
    case "$2" in
        start)
            start
            ;;
        stop)
            stop
            ;;
        restart)
            stop
            start
            ;;
        *)
            echo "Usage: $0 {start|stop|restart|uninstall}"
    esac
else

    case "$1" in
        start)
            start
            ;;
        stop)
            stop
            ;;
        restart)
            stop
            start
            ;;
        *)
            echo "Usage: $0 {start|stop|restart|uninstall}"
    esac
fi
