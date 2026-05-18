// Jenkins declarative pipeline for SRWA.
// Implements the lecture's V&V loop: lint -> static analysis -> unit -> integration -> build -> deploy.
pipeline {
    agent any

    options {
        timestamps()
        ansiColor('xterm')
        timeout(time: 20, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '20'))
        disableConcurrentBuilds()
    }

    environment {
        IMAGE_NAME = 'srwa/php'
        IMAGE_TAG  = "build-${env.BUILD_NUMBER}"
        COMPOSE    = 'docker compose -f docker-compose.yml -f docker/jenkins/docker-compose.ci.yml'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                sh 'git log -1 --pretty=format:"%h %an %s" | tee .commit.txt'
            }
        }

        stage('Install deps') {
            steps {
                sh '''
                    docker run --rm \
                        -v "$PWD/app":/app \
                        -w /app \
                        composer:2.7 install --no-interaction --prefer-dist
                '''
            }
        }

        stage('Static analysis (lint + style)') {
            parallel {
                stage('PHP lint') {
                    steps {
                        sh 'find app/src app/public -name "*.php" -print0 | xargs -0 -n1 -P4 php -l'
                    }
                }
                stage('PSR-12 (PHP_CodeSniffer)') {
                    steps {
                        sh 'app/vendor/bin/phpcs --standard=phpcs.xml --report=checkstyle --report-file=build/phpcs.xml || true'
                    }
                    post {
                        always {
                            recordIssues enabledForFailure: true,
                                         tools: [phpCodeSniffer(pattern: 'build/phpcs.xml')]
                        }
                    }
                }
            }
        }

        stage('Unit tests') {
            steps {
                sh 'mkdir -p build && app/vendor/bin/phpunit --configuration app/phpunit.xml --log-junit build/junit.xml --coverage-cobertura build/cobertura.xml || true'
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: 'build/junit.xml'
                }
            }
        }

        stage('Build image') {
            steps {
                sh 'docker build -t ${IMAGE_NAME}:${IMAGE_TAG} -t ${IMAGE_NAME}:latest .'
            }
        }

        stage('Integration smoke test') {
            steps {
                sh '''
                    cp .env.example .env
                    ${COMPOSE} up -d --wait
                    # Wait for nginx to respond
                    for i in $(seq 1 30); do
                        if curl -fsS http://localhost:8080/healthz; then break; fi
                        sleep 2
                    done
                    curl -fsS http://localhost:8080/healthz
                    curl -fsS http://localhost:8080/api/menu | head -c 200
                '''
            }
            post {
                always { sh '${COMPOSE} down -v || true' }
            }
        }

        stage('Deploy') {
            when { branch 'main' }
            steps {
                echo "Deploy step is environment-specific. Push image to registry here."
                // sh 'docker push ${IMAGE_NAME}:${IMAGE_TAG}'
            }
        }
    }

    post {
        success { echo "Build ${IMAGE_TAG} green." }
        failure { echo "Build ${IMAGE_TAG} failed — see stage logs." }
        always  { archiveArtifacts artifacts: 'build/**', allowEmptyArchive: true }
    }
}
