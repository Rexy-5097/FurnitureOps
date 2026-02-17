import { NextResponse } from 'next/server';
import { logger } from './logger';

type RouteHandler = (req: Request, context: any) => Promise<NextResponse | Response>;

export function withObservability(handler: RouteHandler): RouteHandler {
  return async (req: Request, context: any) => {
    const start = Date.now();
    const requestId = req.headers.get('X-Request-ID') || crypto.randomUUID();

    // 1. Attach Request ID to Logger Context (Conceptually - if using AsyncLocalStorage)
    // For now, we explicitly pass it in logs.

    try {
      const response = await handler(req, context);
      
      const duration = Date.now() - start;
      const status = response.status;
      
      // 2. Structured Logging
      logger.info('API Request Completed', {
        requestId,
        status,
        durationMs: duration,
        details: {
            method: req.method,
            url: req.url
        }
      });

      // 3. Attach ID to Response (if not already there)
      if (!response.headers.has('X-Request-ID')) {
        response.headers.set('X-Request-ID', requestId);
      }

      return response;

    } catch (error: any) {
      const duration = Date.now() - start;
      
      // 4. Global Error Capture
      logger.error('Unhandled API Error', {
        requestId,
        durationMs: duration,
        details: {
            method: req.method,
            url: req.url,
            error: error.message,
            stack: error.stack,
            errorCategory: 'SYSTEM_ERROR'
        }
      });

      return NextResponse.json(
        { error: 'Internal Server Error', requestId },
        { status: 500 }
      );
    }
  };
}

// 5. Global Process Handlers (Note: limited support in Edge, good for Node)
if (typeof process !== 'undefined' && process.on) {
    process.on('unhandledRejection', (reason) => {
        logger.error('Unhandled Promise Rejection', { 
            details: {
                error: reason instanceof Error ? reason.message : String(reason),
                type: 'UNHANDLED_REJECTION'
            }
        });
    });

    process.on('uncaughtException', (error) => {
        logger.error('Uncaught Exception', { 
            details: {
                error: error.message, 
                stack: error.stack, 
                type: 'UNCAUGHT_EXCEPTION' 
            }
        });
        // In containerized env, let it crash to restart. In Lambda, it ends invocation.
    });
}
