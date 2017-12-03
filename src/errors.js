// TODO each message should be link
export const MISSING_BASE_URL = 'MISSING_BASE_URL';
/*`
 "baseUrl" is required when using "uri" in the action.
 Specify "baseUrl" when configuring the middleware.
i.e:
       import declarativeRequest from 'redux-declarative-request';

       declarativeRequest({
        baseUrl: 'http://your-base.url/is/here'
      });
`;*/

export const MISSING_REQUEST_BUILDER = 'MISSING_REQUEST_BUILDER';

/*`
 Request builder function ("buildRequest") is required.
 You are trying to use redux-declarative-request without declaring "buildRequest".
 .i.e:

     import declarativeRequest from 'redux-declarative-request';

     declarativeRequest({
      buildRequest: ({url, method, query, body, options}) => {
         if (method === 'get' || method === 'options')
          return window.fetch[method](url + '?' + q.string(query), options);
        if (method === 'post' || method === 'put')
           return window.fetch[method](url, body, options);
      }
    });
`
*/
