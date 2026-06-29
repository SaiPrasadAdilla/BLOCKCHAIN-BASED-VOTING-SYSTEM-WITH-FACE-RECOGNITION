import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class RequestParsingMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {

    // Checking parsing request body
    if(req.is('application/json') == 'application/json') {
      try{
        req.body = JSON.parse(JSON.stringify(req.body));
      }catch(error) {
        return res.sendStatus(400).send("Invalid JSON payload recieved !!!")
      }
    } else {
      return res.sendStatus(405).send('Invalid payload.... Please send the correct payloads with appropriate types !!!!')
    }
    next();

  }
}
