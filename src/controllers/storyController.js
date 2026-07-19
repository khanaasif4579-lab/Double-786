// Story Controller

const Project = require('../models/Project');
const APIRouter = require('../services/APIRouter');
const StorageService = require('../services/StorageService');
const PDFGenerator = require('../services/PDFGenerator');

// Create new story
exports.createStory = async (req, res) => {
  try {
    const { title, description, genre, mood, storyIdea } = req.body;
    const userId = req.user._id;

    // Route to AI API for story generation
    const aiRouter = new APIRouter();
    const storyContent = await aiRouter.generateStory({
      title,
      description,
      genre,
      mood,
      storyIdea
    });

    // Create project record
    const project = new Project({
      title,
      description,
      genre,
      mood,
      createdBy: userId,
      metadata: {
        language: req.user.language
      },
      aiGenerationDetails: {
        storyGeneratedBy: aiRouter.getPrimaryAPI('story_generation'),
        generationPrompt: storyIdea
      }
    });

    // Save story content
    const storageService = new StorageService();
    const storyFilePath = await storageService.saveStory(
      project.projectId,
      storyContent
    );

    project.storyFile = storyFilePath;
    await project.save();

    // Generate PDF
    const pdfGenerator = new PDFGenerator();
    const pdfPath = await pdfGenerator.generateStoryPDF(
      project.projectId,
      storyContent
    );

    res.status(201).json({
      success: true,
      data: {
        projectId: project.projectId,
        title: project.title,
        status: project.status,
        storyFile: storyFilePath,
        pdfFile: pdfPath
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get story details
exports.getStory = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findOne({ projectId })
      .populate('createdBy', 'fullName email');

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Story not found'
      });
    }

    // Check permissions
    if (project.createdBy._id.toString() !== req.user._id.toString() && 
        req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this story'
      });
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update story
exports.updateStory = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, genre, mood, content } = req.body;

    let project = await Project.findOne({ projectId });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Story not found'
      });
    }

    // Check permissions
    if (project.createdBy.toString() !== req.user._id.toString() && 
        req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update this story'
      });
    }

    // Update fields
    project.title = title || project.title;
    project.description = description || project.description;
    project.genre = genre || project.genre;
    project.mood = mood || project.mood;
    project.version++;

    // Save updated content
    if (content) {
      const storageService = new StorageService();
      const storyFilePath = await storageService.saveStory(
        project.projectId,
        content,
        project.version
      );
      project.storyFile = storyFilePath;
    }

    await project.save();

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Publish story to marketplace
exports.publishStory = async (req, res) => {
  try {
    const { projectId } = req.params;

    let project = await Project.findOne({ projectId });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Story not found'
      });
    }

    // Check permissions (admin/owner only)
    if (req.user.userType !== 'admin' && 
        project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to publish this story'
      });
    }

    project.status = 'approved';
    project.isPublished = true;
    project.publishedAt = new Date();

    // Generate search tags if not present
    if (!project.searchTags || project.searchTags.length === 0) {
      const aiRouter = new APIRouter();
      project.searchTags = await aiRouter.generateSearchTags({
        title: project.title,
        description: project.description,
        genre: project.genre,
        mood: project.mood
      });
    }

    await project.save();

    res.status(200).json({
      success: true,
      message: 'Story published successfully',
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Delete story
exports.deleteStory = async (req, res) => {
  try {
    const { projectId } = req.params;

    let project = await Project.findOne({ projectId });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Story not found'
      });
    }

    // Check permissions
    if (req.user.userType !== 'admin' && 
        project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to delete this story'
      });
    }

    // Soft delete
    await project.softDelete();

    res.status(200).json({
      success: true,
      message: 'Story deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = exports;
