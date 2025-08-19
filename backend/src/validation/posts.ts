import Joi from 'joi';

export const validatePost = (data: any) => {
  const schema = Joi.object({
    title: Joi.string()
      .min(5)
      .max(200)
      .trim()
      .required()
      .messages({
        'string.min': 'Title must be at least 5 characters long',
        'string.max': 'Title cannot exceed 200 characters',
        'any.required': 'Title is required'
      }),
    
    content: Joi.string()
      .min(100)
      .required()
      .messages({
        'string.min': 'Content must be at least 100 characters long',
        'any.required': 'Content is required'
      }),
    
    excerpt: Joi.string()
      .min(20)
      .max(500)
      .trim()
      .required()
      .messages({
        'string.min': 'Excerpt must be at least 20 characters long',
        'string.max': 'Excerpt cannot exceed 500 characters',
        'any.required': 'Excerpt is required'
      }),
    
    tags: Joi.array()
      .items(
        Joi.string()
          .min(2)
          .max(20)
          .lowercase()
          .trim()
      )
      .max(10)
      .default([])
      .messages({
        'array.max': 'Cannot have more than 10 tags',
        'string.min': 'Tag must be at least 2 characters long',
        'string.max': 'Tag cannot exceed 20 characters'
      }),
    
    status: Joi.string()
      .valid('draft', 'published', 'archived')
      .default('draft')
      .messages({
        'any.only': 'Status must be draft, published, or archived'
      }),
    
    featuredImage: Joi.string()
      .uri()
      .allow(null, '')
      .optional()
      .messages({
        'string.uri': 'Featured image must be a valid URL'
      })
  });

  return schema.validate(data);
};

export const validatePostUpdate = (data: any) => {
  const schema = Joi.object({
    title: Joi.string()
      .min(5)
      .max(200)
      .trim()
      .optional()
      .messages({
        'string.min': 'Title must be at least 5 characters long',
        'string.max': 'Title cannot exceed 200 characters'
      }),
    
    content: Joi.string()
      .min(100)
      .optional()
      .messages({
        'string.min': 'Content must be at least 100 characters long'
      }),
    
    excerpt: Joi.string()
      .min(20)
      .max(500)
      .trim()
      .optional()
      .messages({
        'string.min': 'Excerpt must be at least 20 characters long',
        'string.max': 'Excerpt cannot exceed 500 characters'
      }),
    
    tags: Joi.array()
      .items(
        Joi.string()
          .min(2)
          .max(20)
          .lowercase()
          .trim()
      )
      .max(10)
      .optional()
      .messages({
        'array.max': 'Cannot have more than 10 tags',
        'string.min': 'Tag must be at least 2 characters long',
        'string.max': 'Tag cannot exceed 20 characters'
      }),
    
    status: Joi.string()
      .valid('draft', 'published', 'archived')
      .optional()
      .messages({
        'any.only': 'Status must be draft, published, or archived'
      }),
    
    featuredImage: Joi.string()
      .uri()
      .allow(null, '')
      .optional()
      .messages({
        'string.uri': 'Featured image must be a valid URL'
      })
  });

  return schema.validate(data);
};
