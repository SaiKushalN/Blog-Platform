import Joi from 'joi';

export const validateComment = (data: any) => {
  const schema = Joi.object({
    content: Joi.string()
      .min(1)
      .max(1000)
      .trim()
      .required()
      .messages({
        'string.min': 'Comment cannot be empty',
        'string.max': 'Comment cannot exceed 1000 characters',
        'any.required': 'Comment content is required'
      }),
    
    post: Joi.string()
      .required()
      .messages({
        'any.required': 'Post ID is required'
      }),
    
    parentComment: Joi.string()
      .allow(null, '')
      .optional()
      .messages({
        'string.base': 'Parent comment ID must be a string'
      })
  });

  return schema.validate(data);
};

export const validateCommentUpdate = (data: any) => {
  const schema = Joi.object({
    content: Joi.string()
      .min(1)
      .max(1000)
      .trim()
      .required()
      .messages({
        'string.min': 'Comment cannot be empty',
        'string.max': 'Comment cannot exceed 1000 characters',
        'any.required': 'Comment content is required'
      })
  });

  return schema.validate(data);
};

export const validateCommentModeration = (data: any) => {
  const schema = Joi.object({
    action: Joi.string()
      .valid('approve', 'reject', 'delete', 'flag')
      .required()
      .messages({
        'any.only': 'Action must be approve, reject, delete, or flag',
        'any.required': 'Moderation action is required'
      }),
    
    reason: Joi.string()
      .max(500)
      .trim()
      .optional()
      .messages({
        'string.max': 'Reason cannot exceed 500 characters'
      })
  });

  return schema.validate(data);
};
