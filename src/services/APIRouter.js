// API Router Service

const APIIntegration = require('../models/APIIntegration');
const axios = require('axios');
const logger = require('../utils/logger');

class APIRouter {
  constructor() {
    this.apis = {};
    this.loadAPIs();
  }

  async loadAPIs() {
    try {
      const apis = await APIIntegration.find({ isActive: true });
      apis.forEach(api => {
        this.apis[api.serviceType] = this.apis[api.serviceType] || [];
        this.apis[api.serviceType].push({
          id: api._id,
          name: api.apiName,
          provider: api.provider,
          apiKey: api.getApiKey(),
          baseUrl: api.baseUrl,
          apiVersion: api.apiVersion,
          fallbackId: api.fallbackApiId,
          timeout: api.timeout,
          rateLimit: api.rateLimit
        });
      });
    } catch (error) {
      logger.error('Error loading APIs', error);
    }
  }

  getPrimaryAPI(serviceType) {
    const apis = this.apis[serviceType];
    if (!apis || apis.length === 0) return null;
    return apis[0];
  }

  async generateStory(options) {
    const api = this.getPrimaryAPI('story_generation');
    if (!api) throw new Error('No story generation API configured');

    try {
      const startTime = Date.now();
      
      const response = await axios.post(
        `${api.baseUrl}/v1/chat/completions`,
        {
          model: 'gpt-4',
          messages: [{
            role: 'user',
            content: `Create a professional story screenplay based on this idea:\n${options.storyIdea}\n\nGenre: ${options.genre}\nMood: ${options.mood}\n\nProvide screenplay format with scenes, dialogue, and directions.`
          }],
          max_tokens: 4000
        },
        {
          headers: {
            'Authorization': `Bearer ${api.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: api.timeout * 1000
        }
      );

      const responseTime = Date.now() - startTime;
      
      // Record stats
      await this.recordAPIUsage(api.id, true, responseTime);

      return response.data.choices[0].message.content;
    } catch (error) {
      logger.error('Story generation failed', error);
      
      // Try fallback
      if (api.fallbackId) {
        return this.generateStoryWithFallback(options, api.fallbackId);
      }
      throw error;
    }
  }

  async generateMusic(options) {
    const api = this.getPrimaryAPI('music_generation');
    if (!api) throw new Error('No music generation API configured');

    try {
      const startTime = Date.now();
      
      const response = await axios.post(
        `${api.baseUrl}/api/v1/generate`,
        {
          title: options.title,
          mood: options.mood,
          duration: options.duration,
          genre: options.genre
        },
        {
          headers: {
            'X-API-Key': api.apiKey,
            'Content-Type': 'application/json'
          },
          timeout: api.timeout * 1000
        }
      );

      const responseTime = Date.now() - startTime;
      
      // Record stats
      await this.recordAPIUsage(api.id, true, responseTime);

      return response.data;
    } catch (error) {
      logger.error('Music generation failed', error);
      
      if (api.fallbackId) {
        return this.generateMusicWithFallback(options, api.fallbackId);
      }
      throw error;
    }
  }

  async generateSearchTags(options) {
    const api = this.getPrimaryAPI('story_generation');
    if (!api) throw new Error('No AI API configured');

    try {
      const response = await axios.post(
        `${api.baseUrl}/v1/chat/completions`,
        {
          model: 'gpt-4',
          messages: [{
            role: 'user',
            content: `Generate 10 search tags for this story:\nTitle: ${options.title}\nDescription: ${options.description}\nGenre: ${options.genre}\nMood: ${options.mood}\n\nReturn as comma-separated list.`
          }],
          max_tokens: 100
        },
        {
          headers: {
            'Authorization': `Bearer ${api.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: api.timeout * 1000
        }
      );

      const tags = response.data.choices[0].message.content
        .split(',')
        .map(tag => tag.trim());
      
      return tags;
    } catch (error) {
      logger.error('Search tags generation failed', error);
      return [];
    }
  }

  async recordAPIUsage(apiId, success, responseTime) {
    try {
      const api = await APIIntegration.findById(apiId);
      if (api) {
        await api.recordRequest(success, responseTime);
      }
    } catch (error) {
      logger.error('Error recording API usage', error);
    }
  }

  async testAPI(apiId) {
    try {
      const api = await APIIntegration.findById(apiId);
      if (!api) throw new Error('API not found');

      const apiKey = api.getApiKey();
      
      const response = await axios.get(
        `${api.baseUrl}/health`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      api.testStatus = 'ok';
      api.testMessage = 'Connection successful';
      api.lastTestedAt = new Date();
      api.lastTestResult = response.data;
      
      await api.save();
      
      return { success: true, data: response.data };
    } catch (error) {
      const api = await APIIntegration.findById(apiId);
      api.testStatus = 'failed';
      api.testMessage = error.message;
      api.lastErrorMessage = error.message;
      api.lastErrorAt = new Date();
      
      await api.save();
      
      return { success: false, error: error.message };
    }
  }
}

module.exports = APIRouter;
