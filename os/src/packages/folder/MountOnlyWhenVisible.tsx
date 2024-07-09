import React, { useEffect, useRef, useState } from "react";

export const MountOnlyWhenVisible = ({ children, height = "200px" }) => {
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

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
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
