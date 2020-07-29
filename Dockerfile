# resource
FROM alpine/git as resource

WORKDIR /data

RUN git clone https://github.com/wavesheep/wavesheep-blog-engine.git .
RUN git clone https://github.com/wavesheep/blog.git data/

# runtime
FROM node:12.16.1 AS runtime

COPY --from=resource /data/ /data/

WORKDIR /data/

RUN npm i && npm run build && npm run generate

ENTRYPOINT npm run prod:start