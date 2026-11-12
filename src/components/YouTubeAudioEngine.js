// YouTubeAudioEngine.js - High-Performance Direct YouTube Engine
import React, { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const HTML_TEMPLATE = (videoId, autoplay) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background-color: #000; overflow: hidden; }
    #player { width: 100%; height: 100%; position: absolute; top: 0; left: 0; }
  </style>
</head>
<body>
  <div id="player"></div>
  <script>
    var player = null;
    var isReady = false;
    var currentId = "${videoId || ''}";
    var shouldPlay = ${autoplay ? 'true' : 'false'};

    function post(type, data) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, data: data }));
      }
    }

    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    function onYouTubeIframeAPIReady() {
      player = new YT.Player('player', {
        width: '100%',
        height: '100%',
        videoId: currentId,
        playerVars: {
          autoplay: shouldPlay ? 1 : 0,
          playsinline: 1,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          fs: 0,
          iv_load_policy: 3,
          enablejsapi: 1,
          origin: 'https://www.youtube.com'
        },
        events: {
          'onReady': function(e) {
            isReady = true;
            post('ready', { videoId: currentId });
            if (shouldPlay) {
              try { e.target.playVideo(); } catch (err) {}
            }
          },
          'onStateChange': function(e) {
            var stateNames = {
              '-1': 'unstarted',
              '0': 'ended',
              '1': 'playing',
              '2': 'paused',
              '3': 'buffering',
              '5': 'cued'
            };
            post('stateChange', stateNames[e.data] || String(e.data));
          },
          'onError': function(e) {
            post('error', e.data);
          }
        }
      });
    }

    window.ytPlay = function() {
      shouldPlay = true;
      if (player && typeof player.playVideo === 'function') {
        player.playVideo();
      }
    };

    window.ytPause = function() {
      shouldPlay = false;
      if (player && typeof player.pauseVideo === 'function') {
        player.pauseVideo();
      }
    };

    window.ytLoad = function(newId) {
      currentId = newId;
      shouldPlay = true;
      if (player && typeof player.loadVideoById === 'function') {
        player.loadVideoById(newId);
      }
    };

    window.ytSeek = function(sec) {
      if (player && typeof player.seekTo === 'function') {
        player.seekTo(sec, true);
      }
    };

    setInterval(function() {
      if (player && isReady && typeof player.getCurrentTime === 'function') {
        try {
          var cur = player.getCurrentTime();
          var dur = (typeof player.getDuration === 'function') ? player.getDuration() : 0;
          if (cur !== undefined && !isNaN(cur)) {
            post('timeUpdate', { currentTime: cur, duration: dur });
          }
        } catch (e) {}
      }
    }, 500);
  </script>
</body>
</html>
`;

const YouTubeAudioEngine = forwardRef(function YouTubeAudioEngine(
  { onStateChange, onTimeUpdate, onError, currentVideoId, isPlaying },
  ref
) {
  const webViewRef = useRef(null);
  const lastVideoIdRef = useRef(currentVideoId);
  const isReadyRef = useRef(false);

  useImperativeHandle(ref, () => ({
    seekTo: (seconds) => {
      try {
        webViewRef.current?.injectJavaScript(`window.ytSeek(${seconds}); true;`);
      } catch (e) {}
    },
    play: () => {
      try {
        webViewRef.current?.injectJavaScript(`window.ytPlay(); true;`);
      } catch (e) {}
    },
    pause: () => {
      try {
        webViewRef.current?.injectJavaScript(`window.ytPause(); true;`);
      } catch (e) {}
    },
  }));

  // Handle play/pause toggle from React Native
  useEffect(() => {
    if (isReadyRef.current) {
      if (isPlaying) {
        webViewRef.current?.injectJavaScript(`window.ytPlay(); true;`);
      } else {
        webViewRef.current?.injectJavaScript(`window.ytPause(); true;`);
      }
    }
  }, [isPlaying]);

  // Handle videoId track change
  useEffect(() => {
    if (!currentVideoId) return;

    if (lastVideoIdRef.current !== currentVideoId) {
      lastVideoIdRef.current = currentVideoId;
      if (isReadyRef.current) {
        console.log('[YouTubeEngine] Loading new track via JS bridge:', currentVideoId);
        webViewRef.current?.injectJavaScript(`window.ytLoad("${currentVideoId}"); true;`);
      }
    }
  }, [currentVideoId]);

  const handleMessage = (event) => {
    try {
      const { type, data } = JSON.parse(event.nativeEvent.data);

      if (type === 'ready') {
        console.log('[YouTubeEngine] YouTube player is READY for:', data?.videoId);
        isReadyRef.current = true;
        if (isPlaying) {
          webViewRef.current?.injectJavaScript(`window.ytPlay(); true;`);
        }
      } else if (type === 'stateChange') {
        console.log('[YouTubeEngine] State:', data);
        if (onStateChange) onStateChange(data);
      } else if (type === 'timeUpdate') {
        if (onTimeUpdate) onTimeUpdate(data);
      } else if (type === 'error') {
        console.warn('[YouTubeEngine] Error code:', data);
        if (onError) onError(data);
      }
    } catch (e) {
      console.warn('[YouTubeEngine] onMessage parse error:', e);
    }
  };

  if (!currentVideoId) {
    return null;
  }

  return (
    <View style={styles.hiddenContainer} pointerEvents="none">
      <WebView
        ref={webViewRef}
        source={{
          html: HTML_TEMPLATE(currentVideoId, isPlaying),
          baseUrl: 'https://www.youtube.com',
        }}
        originWhitelist={['*']}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        allowsAirPlayForMediaPlayback={true}
        scrollEnabled={false}
        bounces={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixedContentMode="always"
        onMessage={handleMessage}
        style={styles.webView}
      />
    </View>
  );
});

export default YouTubeAudioEngine;

const styles = StyleSheet.create({
  hiddenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 120,
    height: 120,
    opacity: 1,
    zIndex: -9999,
  },
  webView: {
    width: 120,
    height: 120,
    backgroundColor: 'transparent',
  },
});
