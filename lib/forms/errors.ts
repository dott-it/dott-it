export class GoogleFormsError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'GoogleFormsError';
  }
}

export class AuthenticationError extends GoogleFormsError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class FormNotFoundError extends GoogleFormsError {
  constructor(formId: string) {
    super(`Form with ID ${formId} not found`, 404);
    this.name = 'FormNotFoundError';
  }
}

export class FormCreationError extends GoogleFormsError {
  constructor(message: string = 'Failed to create form') {
    super(message, 400);
    this.name = 'FormCreationError';
  }
}

export class InvalidRequestError extends GoogleFormsError {
  constructor(message: string = 'Invalid request parameters') {
    super(message, 400);
    this.name = 'InvalidRequestError';
  }
}
