import Joi from 'joi';

export const validateRegistration = (data: any) => {
  const schema = Joi.object({
    username: Joi.string()
      .min(3)
      .max(30)
      .pattern(/^[a-zA-Z0-9_]+$/)
      .required()
      .messages({
        'string.pattern.base': 'Username can only contain letters, numbers, and underscores',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username cannot exceed 30 characters',
        'any.required': 'Username is required'
      }),
    
    email: Joi.string()
      .email()
      .lowercase()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    
    password: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters long',
        'any.required': 'Password is required'
      })
  });

  return schema.validate(data);
};

export const validateLogin = (data: any) => {
  const schema = Joi.object({
    email: Joi.string()
      .email()
      .lowercase()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required'
      })
  });

  return schema.validate(data);
};

export const validatePasswordUpdate = (data: any) => {
  const schema = Joi.object({
    currentPassword: Joi.string()
      .required()
      .messages({
        'any.required': 'Current password is required'
      }),
    
    newPassword: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.min': 'New password must be at least 6 characters long',
        'any.required': 'New password is required'
      })
  });

  return schema.validate(data);
};
