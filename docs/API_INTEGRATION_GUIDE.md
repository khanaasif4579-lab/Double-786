# API Integration Manager - Developer Guide

## Overview

The API Integration Manager allows ASIF ALI STUDIO to connect multiple AI services dynamically without modifying core code.

## Adding a New AI Service

### Step 1: Prepare API Credentials

1. Get API key from the service provider
2. Note the base URL (e.g., `https://api.openai.com`)
3. Note the API version (e.g., `v1`)
4. Test credentials locally first

### Step 2: Add via Admin Dashboard

```
Navigate to: Admin Panel → API Integration Manager → Add New API

Fill in:
├─ API Name: "OpenAI Story Generator"
├─ Provider: "OpenAI"
├─ API Key: [paste key]
├─ Base URL: https://api.openai.com/v1
├─ API Version: v1
├─ Service Type: story_generation
├─ Rate Limit: 100 requests/minute
├─ Timeout: 30 seconds
└─ Click "Test" before saving
```

### Step 3: Test the Connection

```
Click "⚡ API Test" button

System will:
1. Verify API key
2. Test endpoint connectivity
3. Send test request
4. Validate response format
5. Display results
```

### Step 4: Save & Activate

```
Once test passes:
└─ Click "Save API"
   └─ System encrypts and stores credentials
   └─ API becomes available to router
   └─ Starts routing requests automatically
```

## API Routing Configuration

### Define Route Mapping

```json
{
  "routes": {
    "story_generation": {
      "primary": "openai-story-v1",
      "fallback": "claude-story-v1",
      "timeout": 30
    },
    "music_generation": {
      "primary": "soundraw-music-v2",
      "fallback": "amper-music-v1",
      "timeout": 60
    },
    "voice_generation": {
      "primary": "elevenlabs-voice-v1",
      "fallback": "google-tts-v1",
      "timeout": 15
    },
    "image_generation": {
      "primary": "dalle-image-v3",
      "fallback": "stable-diffusion-v2",
      "timeout": 45
    }
  }
}
```

## Example: Adding Soundraw Music API

### Get Soundraw Credentials

1. Register at https://soundraw.io
2. Navigate to Developer Settings
3. Create API credentials
4. Copy API Key

### Add to System

```
Admin Panel → API Integration Manager → Add New API

API Name: Soundraw Music Generator
Provider: Soundraw
API Key: sk_live_abc123...
Base URL: https://api.soundraw.io
API Version: v1
Service Type: music_generation
Rate Limit: 50/minute
Timeout: 60 seconds

Click: "Test API"
Result: ✅ Connection successful

Click: "Save API"
Result: ✅ API activated and ready
```

### Automatic Routing

Once added, the system will:

1. When admin clicks "Generate BGM"
2. Router checks primary API (Soundraw) availability
3. If available: Use Soundraw
4. If unavailable: Fall back to Amper Music
5. Route request to selected API
6. Return generated music to admin

## Example: Fallback Chain

```
┌─ User requests music generation
│
├─ Try Primary API (Soundraw)
│  ├─ Check if online: YES
│  ├─ Check rate limit: OK
│  └─ Send request: SUCCESS ✅
│
(If primary fails)
├─ Try Fallback API (Amper Music)
│  ├─ Check if online: YES
│  ├─ Check rate limit: OK
│  └─ Send request: SUCCESS ✅
│
(If fallback also fails)
└─ Use Local Fallback
   ├─ Generate basic BGM locally
   └─ Notify admin: "Using local generation"
```

## Monitoring API Performance

### View Real-time Status

```
Admin Panel → API Integration Manager → API Status

Displays:
├─ API Name
├─ Status: 🟢 Online / 🔴 Offline / 🟡 Degraded
├─ Response Time: 234ms average
├─ Success Rate: 99.2%
├─ Requests Today: 1,245
├─ Rate Limit: 50/min (used: 32)
└─ Last Error: None
```

### View Detailed Logs

```
Admin Panel → API Integration Manager → API Logs

Each log entry contains:
├─ Timestamp
├─ Request: "POST /stories/generate"
├─ Status: 200 OK
├─ Response Time: 2.5s
├─ Tokens Used: 450
└─ Cost: $0.032
```

## Advanced: Custom API Plugin

### Create Custom Plugin

```javascript
// custom_apis/my_music_generator.js

class MyMusicGeneratorAPI {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.name = 'MyMusicGenerator';
  }

  async generateMusic(storyData) {
    const payload = {
      title: storyData.title,
      mood: storyData.mood,
      duration: storyData.duration
    };

    const response = await fetch(
      `${this.baseUrl}/generate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    return await response.json();
  }

  async testConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

module.exports = MyMusicGeneratorAPI;
```

### Upload and Register

```
Admin Panel → API Integration Manager → Plugin Manager

1. Click "Upload Plugin"
2. Select .js file
3. Fill in configuration
4. Test plugin
5. Activate
```

## Rate Limiting Strategy

### Configure Rate Limits

```
API Name: Soundraw
Rate Limit: 50 requests/minute

System will:
├─ Track requests in real-time
├─ Queue requests if limit approached
├─ Throttle requests automatically
├─ Alert admin when limit reached
└─ Switch to fallback if throttled
```

## Cost Tracking

### Monitor API Costs

```
Admin Panel → API Integration Manager → Cost Analytics

Displays:
├─ OpenAI Story Generation
│  ├─ Requests: 1,245
│  ├─ Tokens: 456,789
│  └─ Cost: $4.32
│
├─ Soundraw Music
│  ├─ Requests: 342
│  ├─ Duration: 15,234 minutes
│  └─ Cost: $47.50
│
├─ ElevenLabs Voice
│  ├─ Requests: 567
│  ├─ Characters: 123,456
│  └─ Cost: $12.34
│
└─ TOTAL COST THIS MONTH: $64.16
```

## Troubleshooting

### Issue: API Test Fails

```
Error: "Connection refused"

Solution:
1. Check API key is correct (copy-paste again)
2. Check base URL matches provider docs
3. Check if API service is online
4. Check firewall/network connectivity
5. Contact provider support
```

### Issue: High Latency

```
Error: "Request timeout after 30s"

Solution:
1. Increase timeout setting (if acceptable)
2. Check network connection speed
3. Check API provider status page
4. Consider using fallback API
5. Upgrade API subscription tier
```

### Issue: Rate Limit Exceeded

```
Error: "429 Too Many Requests"

Solution:
1. Reduce rate limit in settings
2. Implement request queuing
3. Use fallback API
4. Upgrade API subscription
5. Contact provider for higher limits
```

## Best Practices

1. **Always Test Before Production**
   - Use "API Test" button
   - Verify response format
   - Check error handling

2. **Set Up Fallbacks**
   - Define primary and fallback APIs
   - Ensure fallback is actively tested
   - Have local fallback ready

3. **Monitor Costs**
   - Track API costs monthly
   - Set up cost alerts
   - Optimize prompt/request sizes

4. **Keep Credentials Secure**
   - Use environment variables
   - Rotate keys monthly
   - Never commit keys to version control

5. **Document Everything**
   - Note why each API was chosen
   - Document rate limits
   - Keep upgrade plans documented

## Future Enhancements

- [ ] Automatic failover to fallback APIs
- [ ] Cost prediction and budgeting
- [ ] Performance benchmarking
- [ ] Multi-region API routing
- [ ] Custom rate limiting rules
- [ ] Advanced caching strategies
- [ ] Machine learning-based API selection

---

**Document Version**: 1.0
**Last Updated**: July 19, 2026
