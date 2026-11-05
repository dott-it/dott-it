/**
 * @jest-environment node
 */

import type { forms_v1 } from 'googleapis'

const listMock = jest.fn()

jest.mock('../auth', () => ({
  GoogleAuth: class {
    async authenticate() {
      return {}
    }
  },
}))

jest.mock('googleapis', () => ({
  google: {
    forms: () => ({
      forms: {
        responses: {
          list: (...args: unknown[]) => listMock(...args),
        },
      },
    }),
    options: jest.fn(),
  },
}))

import { GoogleFormsClient } from '../forms-client'

describe('GoogleFormsClient.listAllResponses', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should follow nextPageToken until all responses are collected', async () => {
    listMock
      .mockResolvedValueOnce({
        data: {
          responses: [{ responseId: 'r1' } as forms_v1.Schema$FormResponse],
          nextPageToken: 'page-2',
        },
      })
      .mockResolvedValueOnce({
        data: {
          responses: [{ responseId: 'r2' } as forms_v1.Schema$FormResponse],
        },
      })

    const client = new GoogleFormsClient()
    await client.initialize()
    const responses = await client.listAllResponses('form-1')

    expect(responses.map((r) => r.responseId)).toEqual(['r1', 'r2'])
    expect(listMock).toHaveBeenCalledTimes(2)
    expect(listMock).toHaveBeenNthCalledWith(1, { formId: 'form-1' })
    expect(listMock).toHaveBeenNthCalledWith(2, { formId: 'form-1', pageToken: 'page-2' })
  })
})
