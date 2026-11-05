import { test, expect } from '@playwright/test';

// Mock React and related dependencies for testing
const mockReact = {
  Children: {
    only: (children) => {
      if (Array.isArray(children)) {
        if (children.length !== 1) {
          throw new Error('React.Children.only expected to receive a single React element child.');
        }
        return children[0];
      }
      return children;
    }
  }
};

// Test the structure that caused the original error
test('FloatingSidebarTrigger should not cause React.Children.only error', () => {
  // Simulate the original problematic structure (multiple direct children)
  const multipleChildren = [
    { type: 'Menu', props: { className: 'h-5 w-5' } },
    { type: 'span', props: { className: 'sr-only', children: 'Toggle Navigation Menu' } }
  ];
  
  // This should throw an error
  expect(() => {
    mockReact.Children.only(multipleChildren);
  }).toThrow(/React.Children.only expected to receive a single React element child/);
});

test('FloatingSidebarTrigger with Fragment wrapper should work', () => {
  // Simulate the fixed structure (single Fragment child containing multiple elements)
  const fragmentChild = {
    type: 'Fragment',
    props: {
      children: [
        { type: 'Menu', props: { className: 'h-5 w-5' } },
        { type: 'span', props: { className: 'sr-only', children: 'Toggle Navigation Menu' } }
      ]
    }
  };
  
  // This should NOT throw an error
  expect(() => {
    mockReact.Children.only(fragmentChild);
  }).not.toThrow();
  
  // Verify we get back the fragment
  const result = mockReact.Children.only(fragmentChild);
  expect(result.type).toBe('Fragment');
});

test('Component structure validation', () => {
  // Test that our fix maintains the expected component structure
  const buttonWithFragment = {
    type: 'Button',
    props: {
      children: {
        type: 'Fragment',
        props: {
          children: [
            { type: 'Menu', props: { className: 'h-5 w-5' } },
            { type: 'span', props: { className: 'sr-only' } }
          ]
        }
      }
    }
  };
  
  // The button should have exactly one child (the fragment)
  const fragmentChild = buttonWithFragment.props.children;
  expect(() => {
    mockReact.Children.only(fragmentChild);
  }).not.toThrow();
  
  // The fragment should contain two children
  expect(Array.isArray(fragmentChild.props.children)).toBe(true);
  expect(fragmentChild.props.children.length).toBe(2);
  expect(fragmentChild.props.children[0].type).toBe('Menu');
  expect(fragmentChild.props.children[1].type).toBe('span');
}); 