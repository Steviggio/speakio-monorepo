package validation

import (
	"github.com/go-playground/validator/v10"
)

// Validator wraps go-playground/validator for struct validation.
var Validate = validator.New(validator.WithRequiredStructEnabled())
