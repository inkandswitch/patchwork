import React, { ReactNode, useEffect, useRef, useState } from "react";

export const MountOnlyWhenVisible = ({ children, height = "200px" }: { children: ReactNode, height: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.1,
      }
    );

    const currentRef = ref.current;

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  useEffect(() => {
    if (isVisible) {
      console.log("isVisible");
    } else {
      console.log("isNotVisible");
    }
  }, [isVisible]);

  return (
    <div ref={ref} style={{ height, minHeight: height }}>
      {isVisible ? children : null}
    </div>
  );
};
