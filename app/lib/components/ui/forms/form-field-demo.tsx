import React, { useState } from 'react'
import { FormField } from './form-field'
import { Card, CardContent, CardHeader, CardTitle } from '../layout/card'
import { Button } from '../buttons/button'
import { Typography } from '../typography'

export function FormFieldDemo() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    confirmPassword: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (!formData.username) {
      newErrors.username = 'Username is required'
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      alert('Form submitted successfully!')
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div>
        <Typography variant="h2">FormField Component Demo</Typography>
        <Typography variant="body2" color="muted">
          This page demonstrates all variations and states of the FormField component.
        </Typography>
      </div>

      {/* Basic Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="Basic Text Input" placeholder="Enter some text" />

          <FormField label="Required Field" placeholder="This field is required" required />

          <FormField label="Email Input" type="email" placeholder="user@example.com" />

          <FormField label="Password Input" type="password" placeholder="Enter password" />
        </CardContent>
      </Card>

      {/* With Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle>With Descriptions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            label="Username"
            description="This will be visible to other users"
            placeholder="Choose a username"
            required
          />

          <FormField
            label="Password"
            type="password"
            description="Must be at least 8 characters with numbers and symbols"
            placeholder="Create a strong password"
          />

          <FormField
            label="Website URL"
            type="url"
            description="Include https:// at the beginning"
            placeholder="https://example.com"
          />
        </CardContent>
      </Card>

      {/* Error States */}
      <Card>
        <CardHeader>
          <CardTitle>Error States</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            label="Invalid Email"
            type="email"
            value="invalid-email"
            error="Please enter a valid email address"
          />

          <FormField
            label="Weak Password"
            type="password"
            value="123"
            error="Password must be at least 8 characters"
            description="Must contain uppercase, lowercase, numbers and symbols"
          />

          <FormField label="Required Field" error="This field is required" required />
        </CardContent>
      </Card>

      {/* Different Input Types */}
      <Card>
        <CardHeader>
          <CardTitle>Different Input Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            label="Number Input"
            type="number"
            placeholder="Enter a number"
            min="0"
            max="100"
          />

          <FormField label="Date Input" type="date" description="Select your date of birth" />

          <FormField
            label="Phone Number"
            type="tel"
            placeholder="+1 (555) 123-4567"
            description="Include country code"
          />

          <FormField label="Search" type="search" placeholder="Search for something..." />
        </CardContent>
      </Card>

      {/* Working Form Example */}
      <Card>
        <CardHeader>
          <CardTitle>Working Form Example</CardTitle>
          <Typography variant="body2" color="muted">
            Try submitting this form with invalid data to see error validation.
          </Typography>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              error={errors.email}
              placeholder="your@email.com"
              required
            />

            <FormField
              label="Username"
              value={formData.username}
              onChange={handleChange('username')}
              error={errors.username}
              description="At least 3 characters, will be public"
              placeholder="Choose a username"
              required
            />

            <FormField
              label="Password"
              type="password"
              value={formData.password}
              onChange={handleChange('password')}
              error={errors.password}
              description="At least 8 characters"
              placeholder="Create a password"
              required
            />

            <FormField
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange('confirmPassword')}
              error={errors.confirmPassword}
              placeholder="Confirm your password"
              required
            />

            <Button type="submit" className="w-full">
              Create Account
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Custom Styling */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Styling</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            label="Custom Container Spacing"
            placeholder="Custom container class"
            containerClassName="mb-8"
          />

          <FormField
            label="Custom Input Styling"
            placeholder="Custom input class"
            className="border-2 border-blue-500 focus:border-blue-600"
          />
        </CardContent>
      </Card>
    </div>
  )
}
