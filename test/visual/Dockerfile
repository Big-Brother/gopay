FROM circleci/node:9-browsers
USER root
COPY package.json /gopay/package.json
COPY src/environments/dev.ts /gopay/src/environments/dev.ts
WORKDIR /gopay/
RUN npm install --unsafe-perm
COPY . /gopay/
CMD [ "npm", "run", "e2e:capture-latest"]