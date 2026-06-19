@echo off
:: Maven Wrapper for Windows
:: Uses classpath mode to invoke the MavenWrapperMain class
setlocal

set "MAVEN_PROJECTBASEDIR=%~dp0"
set "MAVEN_WRAPPER_JAR=%MAVEN_PROJECTBASEDIR%.mvn\wrapper\maven-wrapper.jar"

set "JAVA_EXEC=java"
if defined JAVA_HOME set "JAVA_EXEC=%JAVA_HOME%\bin\java"

%JAVA_EXEC% -classpath "%MAVEN_WRAPPER_JAR%" ^
  "-Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR%" ^
  org.apache.maven.wrapper.MavenWrapperMain ^
  %*

set EXIT_CODE=%ERRORLEVEL%
endlocal
exit /B %EXIT_CODE%
