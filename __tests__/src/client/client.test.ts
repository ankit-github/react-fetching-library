import fetchMock from 'fetch-mock';

import { createClient } from '../../../src/client/client';
import { Action, QueryResponse } from '../../../src/client/client.types';

describe('Client test', () => {
  it('responses with queryResponse object on success fetch', async () => {
    const action: Action = {
      method: 'GET',
      endpoint: 'http://example.com/users',
    };

    fetchMock.get(action.endpoint, {
      users: [],
    });

    const client = createClient({});

    const queryResponse = await client.query(action);

    expect(queryResponse.payload).toEqual({ users: [] });
    expect(queryResponse.status).toEqual(200);
    expect(queryResponse.error).toEqual(false);
    queryResponse.headers && expect(queryResponse.headers.get('Content-Length')).toEqual('12');
  });

  it('responses with queryResponse object containing error flag true on failed fetch', async () => {
    const action: Action = {
      method: 'GET',
      endpoint: 'http://example.com/users/error',
    };

    fetchMock.get(action.endpoint, {
      throws: new TypeError('Failed to fetch'),
    });

    const client = createClient({});

    const queryResponse = await client.query(action);

    expect(queryResponse.payload).toEqual(undefined);
    expect(queryResponse.status).toEqual(undefined);
    expect(queryResponse.error).toEqual(true);
    queryResponse.headers && expect(queryResponse.headers.get('Content-Length')).toEqual('12');
  });

  it('intercepts response when responseInterceptor is configured', async () => {
    const action: Action = {
      method: 'GET',
      endpoint: 'http://example.com/users/response-interceptors',
    };

    fetchMock.get(action.endpoint, {
      data: {
        users: [],
      },
    });

    const responseInterceptor = () => async (action: Action, response: QueryResponse<any>) => {
      if (response.payload.data) {
        return {
          ...response,
          payload: response.payload.data,
        };
      }

      return response;
    };

    const client = createClient({
      responseInterceptors: [responseInterceptor],
    });

    const queryResponse = await client.query(action);

    expect(queryResponse.payload).toEqual({ users: [] });
  });

  it('intercepts request when requestInterceptor is configured', async () => {
    const action: Action = {
      method: 'GET',
      endpoint: 'request-interceptors',
    };

    fetchMock.get('http://example.com/users/request-interceptors', {
      users: [],
    });

    const requestInterceptor = () => async (action: Action) => {
      return {
        ...action,
        endpoint: `http://example.com/users/${action.endpoint}`
      };
    };

    const client = createClient({
      requestInterceptors: [requestInterceptor],
    });

    const queryResponse = await client.query(action);

    expect(queryResponse.payload).toEqual({ users: [] });
  });
});
