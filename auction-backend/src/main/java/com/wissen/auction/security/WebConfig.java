package com.wissen.auction.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final CityValidationInterceptor cityValidationInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(cityValidationInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/auth/**"); // login/logout don't have a city segment
    }
}
